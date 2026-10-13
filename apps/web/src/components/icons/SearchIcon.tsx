import type { ComponentProps } from "react";


export default function SearchIcon({className, ...rest}: ComponentProps<"svg">){
    return(
        <svg className={`size-5 stroke-(--skools-icon-muted) ${className ?? ""}`} {...rest} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_981_2084)">
                <path d="M7.87524 13.5002C10.9818 13.5002 13.5002 10.9818 13.5002 7.87521C13.5002 4.76861 10.9818 2.25021 7.87524 2.25021C4.76864 2.25021 2.25024 4.76861 2.25024 7.87521C2.25024 10.9818 4.76864 13.5002 7.87524 13.5002Z" strokeWidth="1.30435" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.8528 11.8548L14.3999 14.133" strokeWidth="1.30435" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <defs>
                <clipPath id="clip0_981_2084">
                    <rect width="18" height="18" fill="white"/>
                </clipPath>
            </defs>
        </svg>

    )
}