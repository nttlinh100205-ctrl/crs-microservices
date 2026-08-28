import type { Course } from '../types/course';
import type { LoadState } from '../api/useCourses';

interface CourseListProps {
    courses: Course[];
    state: LoadState;
    errorMessage: string;
    onRetry: () => void;
}

export default function CourseList({
                                       courses,
                                       state,
                                       errorMessage,
                                       onRetry,
                                   }: CourseListProps) {
    if (state === 'loading') {
        return <p className="state">Đang tải danh sách môn học...</p>;
    }
    if (state === 'error') {
        return (
            <div className="state state--error">
                <p className="state__title">Có lỗi xảy ra</p>
                <p className="state__desc">{errorMessage}</p>
                <button className="retry-btn" onClick={onRetry}>
                    Thử lại
                </button>
            </div>
        );
    }
    if (state === 'empty') {
        return (
            <div className="state">
                <p className="state__title">Không tìm thấy</p>
                <p className="state__desc">Không tìm thấy môn học nào phù hợp.</p>
            </div>
        );
    }

    // state === 'success'
    return (
        <div className="table-wrap">
            <table className="course-table">
                <thead>
                <tr>
                    <th>Tên môn học</th>
                    <th>Số tín chỉ</th>
                    <th>Số chỗ còn lại</th>
                </tr>
                </thead>
                <tbody>
                {courses.map((course) => (
                    <tr key={course.id}>
                        <td>{course.tenMonHoc}</td>
                        <td>{course.soTinChi}</td>
                        <td
                            className={
                                course.soChoConLai === 0 ? 'seat-full' : 'seat-ok'
                            }
                        >
                            {course.soChoConLai} / {course.soChoToiDa}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
