import { useState, useCallback } from 'react';
import { useCourses } from './api/useCourses';
import SearchBox from './components/SearchBox';
import CourseList from './components/CourseList';
import Pagination from './components/Pagination';
import './App.css';

const PAGE_SIZE = 2;

function App() {
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(0);
    const { courses, totalPages, state, errorMessage, refetch } =
        useCourses(keyword, page, PAGE_SIZE);

    const handleSearch = useCallback((newKeyword: string) => {
        setKeyword((prev) => {
            if (prev === newKeyword) return prev;
            setPage(0);
            return newKeyword;
        });
    }, []);

    return (
        <div className="page">
            <header className="header">
                <h1>Danh sách môn học</h1>

            </header>

            <div className="search-row">
                <SearchBox onSearch={handleSearch} />
            </div>

            <CourseList
                courses={courses}
                state={state}
                errorMessage={errorMessage}
                onRetry={refetch}
            />

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}

export default App;
