const statusConfig = {
    backlog: {
        label: "Backlog",
        className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    },
    todo: {
        label: "Todo",
        className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
    },
    in_progress: {
        label: "In Progress",
        className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
    },
    in_review: {
        label: "In Review",
        className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    },
    done: {
        label: "Done",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    },
};

const priorityConfig = {
    urgent: {
        label: "Urgent",
        className: "text-rose-600 dark:text-rose-400",
        icon: "!",
    },
    high: {
        label: "High",
        className: "text-orange-600 dark:text-orange-400",
        icon: "↑",
    },
    medium: {
        label: "Medium",
        className: "text-amber-600 dark:text-amber-400",
        icon: "→",
    },
    low: {
        label: "Low",
        className: "text-sky-600 dark:text-sky-400",
        icon: "↓",
    },
    none: {
        label: "None",
        className: "text-muted-foreground",
        icon: "—",
    },
};

export { statusConfig, priorityConfig };