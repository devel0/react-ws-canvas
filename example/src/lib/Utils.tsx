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

export function getComputedStyleMarginPadding(elt: Element) {
    const csty = getComputedStyle(elt);

    const marginLeft = csty.marginLeft ? parseFloat(csty.marginLeft) : 0;
    const marginRight = csty.marginRight ? parseFloat(csty.marginRight) : 0;
    const marginTop = csty.marginTop ? parseFloat(csty.marginTop) : 0;
    const marginBottom = csty.marginBottom ? parseFloat(csty.marginBottom) : 0;

    const paddingLeft = csty.paddingLeft ? parseFloat(csty.paddingLeft) : 0;
    const paddingRight = csty.paddingRight ? parseFloat(csty.paddingRight) : 0;
    const paddingTop = csty.paddingTop ? parseFloat(csty.paddingTop) : 0;
    const paddingBottom = csty.paddingBottom ? parseFloat(csty.paddingBottom) : 0;

    const margin_padding_W = (marginLeft + marginRight + paddingLeft + paddingRight);
    const margin_padding_H = (marginTop + marginBottom + paddingTop + paddingBottom);

    return [margin_padding_W, margin_padding_H];
}

/** hook to retrieve sum or margin(left+right) and padding(left+right) of div element; optionally consider parent's */
export function useDivMarginPadding(div: React.RefObject<HTMLDivElement>, considerParent: boolean = false) {
    const [val, setVal] = useState<number[]>([0, 0]);
    useEffect(() => {
        if (div.current) {
            let res = [0, 0];

            const q = getComputedStyleMarginPadding(div.current);
            res[0] += q[0];
            res[1] += q[1];

            if (considerParent) {
                let p = div.current.parentElement;
                while (p) {
                    const qp = getComputedStyleMarginPadding(p);                    

                    res[0] += qp[0];
                    res[1] += qp[1];

                    p = p.parentElement;
                }
            }

            setVal(res);
        }
    }, [div, considerParent]);

    return val;
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

export function isMobile() {
    const agent = navigator.userAgent;
    return agent.match(/Android/i) ||
        agent.match(/iPhone|iPad|IPod/i) ||
        agent.match(/Opera Mini/i) ||
        agent.match(/IEMobile/i);
}

export function useWindowSize() {
    const [windowSize, setWindowSize] = useState(getWindowSize);

    const handleResize = useCallback(() => {
        setWindowSize(getWindowSize());
    }, []);

    useLayoutEffect(() => {
        handleResize();
        if (!isMobile()) window.addEventListener('resize', handleResize);
        return () => {
            if (!isMobile()) window.removeEventListener('resize', handleResize);
        }
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

    useEffect(() => {
        if (elRef.current) {
            handleResize();
            window.addEventListener("resize", handleResize);
            return () => {
                if (elRef.current)
                    window.removeEventListener("resize", handleResize);
            }
        }
        return () => { };
    }, [elRef]);

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

export interface IEnumValue {
    name: string;
    value: number;
}

/** creates an array of {value:number, name:string} suitable for menuitem and options array creation */
export function mapEnum(e: any) {
    const res = new Array<IEnumValue>();
    for (const item in e) {
        if (isNaN(Number(item))) {
            res.push({ value: e[item], name: item });
        }
    }
    return res;
}