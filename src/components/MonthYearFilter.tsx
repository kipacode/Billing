"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const MONTHS = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

const YEARS = ["2024", "2025", "2026"];

interface MonthYearFilterProps {
    month: string;
    year: string;
    onMonthChange: (month: string) => void;
    onYearChange: (year: string) => void;
}

/* Wrapper to satisfy shadcn v4 Select which may pass null */
function safeChange(fn: (v: string) => void) {
    return (value: string | null) => {
        if (value !== null) fn(value);
    };
}

export function MonthYearFilter({
    month,
    year,
    onMonthChange,
    onYearChange,
}: MonthYearFilterProps) {
    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <Select value={month} onValueChange={safeChange(onMonthChange)}>
                <SelectTrigger className="w-[130px] sm:w-[160px]">
                    <span className="line-clamp-1 flex-1 text-left">
                        {MONTHS.find((m) => m.value === month)?.label || "Month"}
                    </span>
                </SelectTrigger>
                <SelectContent>
                    {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                            {m.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={year} onValueChange={safeChange(onYearChange)}>
                <SelectTrigger className="w-[90px] sm:w-[110px]">
                    <span className="line-clamp-1 flex-1 text-left">
                        {year || "Year"}
                    </span>
                </SelectTrigger>
                <SelectContent>
                    {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>
                            {y}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
