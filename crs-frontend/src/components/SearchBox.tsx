import { useState, useEffect, useRef } from 'react';

interface SearchBoxProps {
    onSearch: (keyword: string) => void;
    placeholder?: string;
}

export default function SearchBox({
                                      onSearch,
                                      placeholder,
                                  }: SearchBoxProps) {
    const [inputValue, setInputValue] = useState('');
    const onSearchRef = useRef(onSearch);
    onSearchRef.current = onSearch;


    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchRef.current(inputValue.trim());
        }, 400);
        return () => clearTimeout(timer);
    }, [inputValue]);

    return (
        <input
            type="text"
            className="search-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder ?? 'Tìm kiếm theo tên môn học...'}
        />
    );
}
