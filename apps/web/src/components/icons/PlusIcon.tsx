import type { ComponentProps } from "react";


export default function PlusIcon({className, ...rest}: ComponentProps<"svg">){
    return(
        <svg className={`size-5 text-(--skools-icon-muted) group-data-[active=true]:text-(--skools-text-primary) group-hover:text-(--skools-icon-primary) ${className ?? ""}`} {...rest} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_995_2355)">
                <path d="M2.1875 7H11.8125" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 2.1875V11.8125" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <defs>
                <clipPath id="clip0_995_2355">
                    <rect width="14" height="14" fill="currentColor"/>
                </clipPath>
            </defs>
        </svg>

    )
}