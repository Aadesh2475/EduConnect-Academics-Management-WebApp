import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    logoSrc?: string;
    logoAlt?: string;
    logoNode?: React.ReactNode;
    title: string;
    description?: string;
    primaryAction: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
        loading?: boolean;
    };
    secondaryActions?: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
    }[];
    formContent?: React.ReactNode;
    skipAction?: {
        label: string;
        onClick: () => void;
    };
    footerContent?: React.ReactNode;
}

const AuthForm = React.forwardRef<HTMLDivElement, AuthFormProps>(
    (
        {
            className,
            logoSrc,
            logoAlt = "Logo",
            logoNode,
            title,
            description,
            primaryAction,
            secondaryActions,
            formContent,
            skipAction,
            footerContent,
            ...props
        },
        ref
    ) => {
        return (
            <div className={cn("flex flex-col items-center justify-center", className)}>
                <Card
                    ref={ref}
                    className={cn(
                        "w-full max-w-sm",
                        "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-500"
                    )}
                    {...props}
                >
                    <CardHeader className="text-center">
                        <div className="mb-4 flex justify-center">
                            {logoNode ? (
                                logoNode
                            ) : logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt={logoAlt}
                                    className="h-12 w-12 object-contain rounded-[4px]"
                                />
                            ) : null}
                        </div>
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            {title}
                        </CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </CardHeader>

                    <CardContent className="grid gap-4">
                        {/* Custom form content (email/password fields etc.) */}
                        {formContent && <div className="grid gap-4">{formContent}</div>}

                        {/* Primary action button */}
                        <Button
                            onClick={primaryAction.onClick}
                            disabled={primaryAction.loading}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white transition-transform hover:scale-[1.02]"
                        >
                            {primaryAction.icon}
                            {primaryAction.label}
                        </Button>

                        {/* OR separator */}
                        {secondaryActions && secondaryActions.length > 0 && (
                            <div className="relative my-1">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">or</span>
                                </div>
                            </div>
                        )}

                        {/* Secondary action buttons */}
                        <div className="grid gap-2">
                            {secondaryActions?.map((action, index) => (
                                <Button
                                    key={index}
                                    variant="secondary"
                                    className="w-full transition-transform hover:scale-[1.02]"
                                    onClick={action.onClick}
                                >
                                    {action.icon}
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    </CardContent>

                    {skipAction && (
                        <CardFooter className="flex flex-col">
                            <Button
                                variant="outline"
                                className="w-full transition-transform hover:scale-[1.02]"
                                onClick={skipAction.onClick}
                            >
                                {skipAction.label}
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                {footerContent && (
                    <div className="mt-6 w-full max-w-sm px-8 text-center text-sm text-muted-foreground animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-500 [animation-delay:200ms]">
                        {footerContent}
                    </div>
                )}
            </div>
        );
    }
);
AuthForm.displayName = "AuthForm";

export { AuthForm };
