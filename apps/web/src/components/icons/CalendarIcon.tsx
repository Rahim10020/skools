import type { ComponentProps } from "react";


export default function CalendarIcon({className, ...rest}: ComponentProps<"svg">){
    return(
        <svg className={`size-5 stroke-(--skools-icon-muted) ${className ?? ""}`} {...rest} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.2197 2.8125H4.78223C4.21973 2.8125 3.65723 3.09375 3.37598 3.375C3.04251 3.70846 2.81348 4.21875 2.81348 4.78125V13.2188C2.81348 13.7813 2.9649 14.1608 3.37598 14.625C3.74735 15.0444 4.21973 15.1875 4.78223 15.1875H13.2197C13.7822 15.1875 14.2239 15.0517 14.626 14.625C15.028 14.1983 15.1885 13.7813 15.1885 13.2188V4.78125C15.1885 4.21875 14.9072 3.6428 14.626 3.375C14.3447 3.1072 13.7822 2.8125 13.2197 2.8125Z" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.375 1.6875V3.9375" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.625 1.6875V3.9375" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2.81348 6.1875H15.1885" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

    )
}