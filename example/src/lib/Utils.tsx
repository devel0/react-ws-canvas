import { useState, useEffect, useLayoutEffect, useCallback } from 'react';

/** from Chris West's Blog ( http://cwestblog.com/2013/09/05/javascript-snippet-convert-number-to-column-name/ ) */
export function toColumnName(num: number) {
    for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
        ret = String.fromCharCode(parseInt(String((num % b) / a)) + 65) + ret;
    }
    return ret;
}

export default function useDebounce(value: any, ms: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), ms);

        return () => clearTimeout(handler);
    }, [value, ms]);

    return debouncedValue;
}

export interface GraphicsSize {
    width: number;
    height: number;
}

export function getWindowSize() {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    } as GraphicsSize;
}

export function useWindowSize() {
    const [windowSize, setWindowSize] = useState(getWindowSize);

    const handleResize = useCallback(() => {
        setWindowSize(getWindowSize());
    }, []);

    useLayoutEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
}

export function getElementSize(div: HTMLElement) {
    return {
        width: div.offsetWidth,
        height: div.offsetHeight
    } as GraphicsSize;
}

export function useElementSize(elRef: React.RefObject<HTMLElement>) {
    const [elSize, setElSize] = useState(elRef.current ? getElementSize(elRef.current) : { width: 0, height: 0 } as GraphicsSize);

    const handleResize = () => {
        if (elRef.current) {
            const size = getElementSize(elRef.current);
            setElSize(size);
        }
    };

    useLayoutEffect(() => {
        if (elRef.current) {
            handleResize();
            window.addEventListener("resize", handleResize);
            return () => {
                if (elRef.current)
                    window.removeEventListener("resize", handleResize);
            }
        }
        return () => { };
    }, [elRef.current]);

    return elSize;
}

export function useScrollPosition(divRef: React.RefObject<HTMLDivElement>) {
    const [scrollPos, setScrollPos] = useState<number[]>([0, 0]);

    const onScroll = (e: Event) => {
        if (divRef.current)
            setScrollPos([divRef.current.scrollLeft, divRef.current.scrollTop]);
    }

    useEffect(() => {
        if (divRef.current) {
            divRef.current.addEventListener("scroll", onScroll);
        }
        return () => {
            if (divRef.current) {
                divRef.current.removeEventListener("scroll", onScroll);
            }
        };
    }, []);

    return scrollPos;
}

export function stringIsValidNumber(n: string) {
    const q = n.match(/^[-+]?\d*(\.\d*)?([eE][-+]?\d+)?$/);

    return (q && q.length > 0) || false;
}