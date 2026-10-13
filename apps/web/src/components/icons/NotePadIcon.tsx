import type { ComponentProps } from "react";


export default function NotePadIcon({className, ...rest}: ComponentProps<"svg">){
    
    return(
        <svg className={`size-5 stroke-(--skools-icon-muted) ${className ?? ""}`} {...rest} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.7511 9H11.2511"  strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.75098 11.25H11.251"  strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.375 3.9375C3.375 3.31618 3.87868 2.8125 4.5 2.8125H13.5C14.1213 2.8125 14.625 3.31618 14.625 3.9375V12.6562C14.625 13.5 14.4088 14.2787 13.7812 14.9062C13.2188 15.4688 12.6562 15.75 11.5312 15.75H6.46875C5.34375 15.75 4.87231 15.5598 4.21875 14.9062C3.56519 14.2527 3.375 13.5 3.375 12.6562V3.9375Z"  strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.62598 1.69141V3.94141"  strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.00098 1.69141V3.94141"  strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.376 1.69141V3.94141"  strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

    )
}