import type { ComponentProps } from "react";

export default function ProfilIcon({ className, ...rest }: ComponentProps<"svg">) {
    return (
        <svg className={`size-5 stroke-(--skools-icon-muted) ${className ?? ""}`} {...rest} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.59375 11.25C9.9237 11.25 11.8125 9.3612 11.8125 7.03125C11.8125 4.7013 9.9237 2.8125 7.59375 2.8125C5.2638 2.8125 3.375 4.7013 3.375 7.03125C3.375 9.3612 5.2638 11.25 7.59375 11.25Z" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1.6875 14.0625C3.13242 12.3434 5.17219 11.25 7.59375 11.25C10.0153 11.25 12.0551 12.3434 13.5 14.0625" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.0625 10.125L15.1875 11.25L17.4375 9" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
