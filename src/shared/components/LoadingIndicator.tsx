export default function LoadingIndicator({ style }: { style?: string }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={`flex flex-grow items-center justify-center bg-slate-50 text-gray-500 ${style ?? ""}`}
        >
            <span className="sr-only">로딩 중</span>
            <div
                className="size-10 shrink-0 rounded-full border-4 border-neutral-200 border-t-current animate-spin"
                aria-hidden
            />
        </div>
    );
}
