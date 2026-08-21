import { useCallback, useEffect, useState } from 'react';
import { getCourses } from './api/courseApi';
import type { Course, PagedResponse } from './types/course';
import './App.css';

type Status = 'loading' | 'error' | 'ready';

const PAGE_SIZE = 9;

function App() {
    const [status, setStatus] = useState<Status>('loading');
    const [page, setPage] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [result, setResult] = useState<PagedResponse<Course> | null>(null);

    const fetchCourses = useCallback((pageToLoad: number, kw: string) => {
        setStatus('loading');
        getCourses(kw || undefined, pageToLoad, PAGE_SIZE)
            .then((res) => {
                setResult(res.data);
                setStatus('ready');
            })
            .catch((err) => {
                console.error(err);
                setStatus('error');
            });
    }, []);

    useEffect(() => {
        fetchCourses(page, keyword);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, keyword]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        setKeyword(keywordInput.trim());
    };

    const courses = result?.content ?? [];
    const totalPages = result?.totalPages ?? 0;

    return (
        <div className="page">
            <div className="board-frame">
                <div className="board">
                    <header className="header">
                        <span className="eyebrow">CRS · Đăng ký học phần</span>
                        <h1 className="title">Danh sách học phần</h1>
                        <svg className="title-underline" viewBox="0 0 260 14" aria-hidden="true">
                            <path d="M4 9 C 60 2, 120 12, 180 5 S 250 3, 256 8" />
                        </svg>
                        <p className="subtitle">
                            Dữ liệu được lấy trực tiếp qua API Gateway. Nếu danh sách trống hoặc báo lỗi,
                            đó là dấu hiệu kết nối tới hệ thống đang có vấn đề.
                        </p>
                        <div className="status-row">
                            {status === 'ready' && (
                                <span className="status-pill status-pill--ok">
                  <span className="status-pill__dot" />
                  Đã kết nối qua Gateway
                </span>
                            )}
                            {status === 'loading' && (
                                <span className="status-pill status-pill--loading">
                  <span className="status-pill__dot" />
                  Đang kết nối...
                </span>
                            )}
                            {status === 'error' && (
                                <span className="status-pill status-pill--error">
                  <span className="status-pill__dot" />
                  Mất kết nối tới Gateway
                </span>
                            )}
                        </div>
                        <form className="search-row" onSubmit={handleSearch}>
                            <input
                                className="search-input"
                                type="text"
                                placeholder="Tìm học phần theo tên..."
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                            />
                            <button className="search-btn" type="submit">Tìm kiếm</button>
                        </form>
                    </header>

                    {status === 'error' && (
                        <div className="state state--error">
                            <svg className="state__icon" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
                                <path d="M9 9 L31 31 M31 9 L9 31" stroke="var(--marker-red)" strokeWidth="3" strokeLinecap="round" fill="none" />
                            </svg>
                            <p className="state__title">Không kết nối được tới hệ thống</p>
                            <p className="state__desc">
                                Kiểm tra lại API Gateway đã chạy chưa, đúng cổng chưa, và origin của frontend
                                đã được cho phép trong cấu hình CORS chưa.
                            </p>
                            <button className="retry-btn" onClick={() => fetchCourses(page, keyword)}>
                                Thử kết nối lại
                            </button>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="grid">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div className="skeleton" key={i}>
                                    <div className="skeleton__bar skeleton__bar--title" />
                                    <div className="skeleton__bar" />
                                    <div className="skeleton__bar skeleton__bar--short" />
                                </div>
                            ))}
                        </div>
                    )}

                    {status === 'ready' && courses.length === 0 && (
                        <div className="state">
                            <p className="state__title">Không tìm thấy học phần nào</p>
                            <p className="state__desc">
                                {keyword
                                    ? `Không có học phần nào khớp với "${keyword}".`
                                    : 'Hệ thống đã kết nối thành công, nhưng chưa có dữ liệu học phần để hiển thị.'}
                            </p>
                        </div>
                    )}

                    {status === 'ready' && courses.length > 0 && (
                        <>
                            <div className="grid">
                                {courses.map((course) => {
                                    const occupied = course.soChoToiDa - course.soChoConLai;
                                    const percentFull = course.soChoToiDa > 0
                                        ? Math.min(100, Math.round((occupied / course.soChoToiDa) * 100))
                                        : 0;
                                    const isFull = course.soChoConLai <= 0;

                                    return (
                                        <article className="card" key={course.id}>
                                            <span className="card__eyebrow">Học phần</span>
                                            <h2 className="card__title">{course.tenMonHoc}</h2>
                                            <div className="card__tags">
                                                <span className="tag tag--credit">{course.soTinChi} tín chỉ</span>
                                            </div>

                                            <div className="seat-info">
                                                <div className="seat-bar">
                                                    <div className="seat-bar__fill" style={{ width: `${percentFull}%` }} />
                                                </div>
                                                <span className="seat-info__text">
                          Còn {course.soChoConLai}/{course.soChoToiDa} chỗ
                        </span>
                                            </div>

                                            <div className="card__footer">
                                                <span className="card__price">{isFull ? 'Đã đầy' : `${100 - percentFull}% còn trống`}</span>
                                                <button className="enroll-btn" disabled={isFull}>
                                                    {isFull ? 'Hết chỗ' : 'Đăng ký'}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            <div className="footer-row">
                                <p className="footnote">
                                    {courses.length} / {result?.totalElements} học phần · trang {page + 1}/{Math.max(totalPages, 1)}
                                </p>
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            className="page-btn"
                                            disabled={page <= 0}
                                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        >
                                            ← Trước
                                        </button>
                                        <button
                                            className="page-btn"
                                            disabled={page + 1 >= totalPages}
                                            onClick={() => setPage((p) => p + 1)}
                                        >
                                            Sau →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="chalk-tray">
                        <div className="chalk-tray__dust">
                            <span />
                            <span />
                            <span />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;