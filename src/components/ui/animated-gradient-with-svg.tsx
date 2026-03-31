"use client";

import React, { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useDimensions } from "@/components/hooks/use-debounced-dimensions";

interface AnimatedGradientProps {
    colors: string[];
    speed?: number;
    blur?: "light" | "medium" | "heavy";
}

const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
    colors,
    speed = 5,
    blur = "light",
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dimensions = useDimensions(containerRef);

    const circleSize = useMemo(
        () => Math.max(dimensions.width, dimensions.height),
        [dimensions.width, dimensions.height]
    );

    // Generate random values once per mount (stable across re-renders).
    // All Math.random() calls must live outside JSX to avoid SSR/client mismatch.
    const randomValues = useMemo(
        () =>
            colors.map(() => ({
                top: Math.random() * 50,
                left: Math.random() * 50,
                tx1: Math.random() - 0.5,
                ty1: Math.random() - 0.5,
                tx2: Math.random() - 0.5,
                ty2: Math.random() - 0.5,
                tx3: Math.random() - 0.5,
                ty3: Math.random() - 0.5,
                tx4: Math.random() - 0.5,
                ty4: Math.random() - 0.5,
                widthFactor: 0.5 + Math.random(),   // replaces randomInt(0.5, 1.5)
                heightFactor: 0.5 + Math.random(),
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [colors.length]
    );

    const blurClass =
        blur === "light"
            ? "blur-2xl"
            : blur === "medium"
                ? "blur-3xl"
                : "blur-[100px]";

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden" suppressHydrationWarning>
            <div className={cn(`absolute inset-0`, blurClass)}>
                {colors.map((color, index) => {
                    const rv = randomValues[index];
                    return (
                        <svg
                            key={index}
                            className="absolute animate-background-gradient"
                            style={
                                {
                                    top: `${rv.top}%`,
                                    left: `${rv.left}%`,
                                    "--background-gradient-speed": `${1 / speed}s`,
                                    "--tx-1": rv.tx1,
                                    "--ty-1": rv.ty1,
                                    "--tx-2": rv.tx2,
                                    "--ty-2": rv.ty2,
                                    "--tx-3": rv.tx3,
                                    "--ty-3": rv.ty3,
                                    "--tx-4": rv.tx4,
                                    "--ty-4": rv.ty4,
                                } as React.CSSProperties
                            }
                            width={circleSize * rv.widthFactor}
                            height={circleSize * rv.heightFactor}
                            viewBox="0 0 100 100"
                        >
                            <circle
                                cx="50"
                                cy="50"
                                r="50"
                                fill={color}
                                className="opacity-30 dark:opacity-[0.15]"
                            />
                        </svg>
                    );
                })}
            </div>
        </div>
    );
};

export { AnimatedGradient };
