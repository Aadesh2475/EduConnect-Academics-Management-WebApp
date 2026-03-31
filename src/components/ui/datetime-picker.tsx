"use client";
import React, { forwardRef, useCallback } from "react";
import { useTimescape, type Options } from "timescape/react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
// @source: https://github.com/dan-lee/timescape?tab=readme-ov-file

const timePickerInputBase =
    "p-1 inline tabular-nums h-fit border border-transparent outline-none content-box rounded-sm min-w-[32px] text-center caret-[#00E599] focus:bg-[#00E599]/10 focus:border-[#00E599]/30 focus-visible:ring-0 focus-visible:outline-none transition-all";
const timePickerSeparatorBase = "text-sm text-[#444444] font-bold";

type DateFormat = "days" | "months" | "years";
type TimeFormat = "hours" | "minutes" | "seconds" | "am/pm";

type DateTimeArray<T extends DateFormat | TimeFormat> = T[];
type DateTimeFormatDefaults = [
    DateTimeArray<DateFormat>,
    DateTimeArray<TimeFormat>,
];

const DEFAULTS = [
    ["days", "months", "years"],
    ["hours", "minutes", "am/pm"],
] as DateTimeFormatDefaults;

type TimescapeReturn = ReturnType<typeof useTimescape>;
type InputPlaceholders = Record<DateFormat | TimeFormat, string>;
const INPUT_PLACEHOLDERS: InputPlaceholders = {
    months: "MM",
    days: "DD",
    years: "YYYY",
    hours: "HH",
    minutes: "MM",
    seconds: "SS",
    "am/pm": "AM/PM",
};

/**
 * Date time picker Docs: {@link: https://shadcn-extension.vercel.app/docs/otp-input}
 */

const DatetimeGrid = forwardRef<
    HTMLDivElement,
    {
        format: DateTimeFormatDefaults;
        className?: string;
        timescape: Pick<TimescapeReturn, "getRootProps" | "getInputProps">;
        placeholders: InputPlaceholders;
    }
>(
    (
        {
            format,
            className,
            timescape,
            placeholders,
        }: {
            format: DateTimeFormatDefaults;
            className?: string;
            timescape: Pick<TimescapeReturn, "getRootProps" | "getInputProps">;
            placeholders: InputPlaceholders;
        },
        ref,
    ) => {
        return (
            <div
                className={cn(
                    "flex flex-wrap items-center w-full p-2 border transition-all",
                    "border-[#1C1C1C] bg-[#090909] rounded-xl gap-1 selection:bg-[#00E599]/30 selection:text-white",
                    "focus-within:border-[#00E599]/50 shadow-sm",
                    className
                )}
                {...timescape.getRootProps()}
                ref={ref}
            >
                {!!format?.length
                    ? format.map((group, i) => (
                        <React.Fragment key={i === 0 ? "dates" : "times"}>
                            {!!group?.length
                                ? group.map((unit, j) => (
                                    <React.Fragment key={unit}>
                                        {unit === "am/pm" ? (
                                            <div className="relative group flex items-center">
                                                <Input
                                                    className={cn(timePickerInputBase, "min-w-[50px] bg-[#1F1F1F] cursor-pointer text-white border-[#1C1C1C]")}
                                                    {...timescape.getInputProps(unit)}
                                                    placeholder={placeholders[unit]}
                                                    readOnly={false}
                                                    id="ampm-input"
                                                />
                                                <div className="absolute top-full text-xs left-1/2 -translate-x-1/2 mt-1 hidden group-focus-within:flex flex-col bg-background border border-border rounded-md shadow-lg overflow-hidden z-50">
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1.5 hover:bg-muted font-medium"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            const input = document.getElementById("ampm-input") as HTMLInputElement;
                                                            if (input) {
                                                                input.focus();
                                                                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
                                                            }
                                                        }}
                                                    >
                                                        AM
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1.5 hover:bg-muted font-medium border-t border-border"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            const input = document.getElementById("ampm-input") as HTMLInputElement;
                                                            if (input) {
                                                                input.focus();
                                                                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));
                                                            }
                                                        }}
                                                    >
                                                        PM
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Input
                                                className={cn(timePickerInputBase, "min-w-[32px] bg-[#1F1F1F] text-white border-[#1C1C1C]", {
                                                    "min-w-[48px]": unit === "years"
                                                })}
                                                {...timescape.getInputProps(unit)}
                                                placeholder={placeholders[unit]}
                                            />
                                        )}
                                        {i === 0 && j < group.length - 1 ? (
                                            // date separator
                                            <span className={timePickerSeparatorBase}>-</span>
                                        ) : (
                                            j < group.length - 2 && (
                                                // time separator
                                                <span className={timePickerSeparatorBase}>:</span>
                                            )
                                        )}
                                    </React.Fragment>
                                ))
                                : null}
                            {format[1]?.length && !i ? (
                                // date-time separator - only if both date and time are present
                                <span
                                    className={cn(
                                        timePickerSeparatorBase,
                                        "mx-1 text-[#00E599]/30",
                                    )}
                                >
                                    |
                                </span>
                            ) : null}
                        </React.Fragment>
                    ))
                    : null}
            </div>
        );
    },
);

DatetimeGrid.displayName = "DatetimeGrid";

// Changed signature slightly to match our existing code implementation (date / setDate instead of value / onChange) to minimize refactoring across the app.
interface DateTimeInput {
    date?: Date;
    setDate?: (date: Date | undefined) => void;
    format?: DateTimeFormatDefaults;
    placeholders?: InputPlaceholders;
    dtOptions?: Options;
    className?: string;
    placeholder?: string;
}

const DEFAULT_TS_OPTIONS = {
    date: new Date(),
    hour12: true,
};
export const DatetimePicker = forwardRef<HTMLDivElement, DateTimeInput>(
    (
        {
            date,
            format = DEFAULTS,
            placeholders,
            dtOptions = DEFAULT_TS_OPTIONS,
            setDate,
            className,
        },
        ref,
    ) => {
        const handleDateChange = useCallback(
            (nextDate: Date | undefined) => {
                setDate ? setDate(nextDate) : console.log(nextDate);
            },
            [setDate],
        );
        const timescape = useTimescape({
            ...dtOptions,
            ...(date && { date: date }),
            onChangeDate: handleDateChange,
        });
        return (
            <DatetimeGrid
                format={format}
                className={className}
                timescape={timescape}
                placeholders={placeholders ?? INPUT_PLACEHOLDERS}
                ref={ref}
            />
        );
    },
);

DatetimePicker.displayName = "DatetimePicker";
