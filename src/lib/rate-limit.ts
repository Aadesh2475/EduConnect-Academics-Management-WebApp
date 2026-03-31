import { prisma } from './prisma'

interface RateLimitOptions {
  identifier: string
  endpoint: string
  maxRequests?: number
  windowMs?: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: Date
}

export async function rateLimit({
  identifier,
  endpoint,
  maxRequests = 100,
  windowMs = 60000,
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)

  try {
    // Fail-safe check for missing model
    if (!prisma.rateLimit) {
      console.warn('RateLimit model not found in Prisma client. Skipping rate limiting.')
      return {
        success: true,
        remaining: maxRequests,
        reset: new Date(now.getTime() + windowMs),
      }
    }

    // Clean up old entries
    await prisma.rateLimit.deleteMany({
      where: {
        windowStart: {
          lt: windowStart,
        },
      },
    })

    // Get or create rate limit entry
    const existing = await prisma.rateLimit.findUnique({
      where: {
        identifier_endpoint: {
          identifier,
          endpoint,
        },
      },
    })

    if (!existing || existing.windowStart < windowStart) {
      // Create new window
      await prisma.rateLimit.upsert({
        where: {
          identifier_endpoint: {
            identifier,
            endpoint,
          },
        },
        create: {
          identifier,
          endpoint,
          count: 1,
          windowStart: now,
        },
        update: {
          count: 1,
          windowStart: now,
        },
      })

      return {
        success: true,
        remaining: maxRequests - 1,
        reset: new Date(now.getTime() + windowMs),
      }
    }

    if (existing.count >= maxRequests) {
      return {
        success: false,
        remaining: 0,
        reset: new Date(existing.windowStart.getTime() + windowMs),
      }
    }

    // Increment counter
    await prisma.rateLimit.update({
      where: {
        identifier_endpoint: {
          identifier,
          endpoint,
        },
      },
      data: {
        count: {
          increment: 1,
        },
      },
    })

    return {
      success: true,
      remaining: maxRequests - existing.count - 1,
      reset: new Date(existing.windowStart.getTime() + windowMs),
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // On error, allow the request but log it
    return {
      success: true,
      remaining: maxRequests,
      reset: new Date(now.getTime() + windowMs),
    }
  }
}

// Helper for API routes
export async function checkRateLimit(
  request: Request,
  endpoint: string,
  maxRequests = 100
): Promise<{ allowed: boolean; headers: Headers }> {
  const ip = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const result = await rateLimit({
    identifier: ip,
    endpoint,
    maxRequests,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
  })

  const headers = new Headers()
  headers.set('X-RateLimit-Limit', maxRequests.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.reset.toISOString())

  return {
    allowed: result.success,
    headers,
  }
}
