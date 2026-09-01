# Tài liệu Thiết kế Biên giới Service & Các Lưu ý Kiến trúc (CRS Microservices)

**Mục đích tài liệu:** Quy định chi tiết kiến trúc biên giới dịch vụ, nguyên tắc sở hữu dữ liệu, cơ chế định tuyến, bảo mật và **toàn bộ các lưu ý kỹ thuật quan trọng** khi triển khai hệ thống CRS (Course Registration System) theo mô hình Microservices.

---

## 1. Tổng quan Kiến trúc & Danh sách Service

### 1.1 Phân chia Danh sách Service

| Service Name | Port (Dev) | Database | Trách nhiệm chính |
| :--- | :---: | :---: | :--- |
| **`api-gateway`** | `8080` | *(Không có)* | Điểm vào duy nhất (Single Entry Point), định tuyến traffic, kiểm tra auth sơ bộ, xử lý CORS, Rate Limiting. |
| **`auth-service`** | `8081` | `auth_db` | Quản lý User, Student, Role; xử lý đăng nhập (Login), đăng ký (Register), sinh và thu hồi JWT. |
| **`course-service`** | `8082` | `course_db` | Quản lý thông tin môn học/khoá học, tìm kiếm, phân trang, quản lý số chỗ khả dụng (seats). |
| **`registration-service`** | `8083` | `registration_db` | Quản lý đơn đăng ký học, kiểm tra điều kiện trùng lịch, gọi `course-service` để giữ/trừ chỗ. |

### 1.2 Lưu ý Kiến trúc Tổng quan
- **Môi trường Production**: Không sử dụng `localhost` cố định trong cấu hình; bắt buộc dùng **Service Discovery** (như Spring Cloud Netflix Eureka / Consul / Kubernetes DNS) để định danh service động qua Service Name.
- **Tính khả dụng (High Availability)**: Các service phải được thiết kế dạng *stateless* (không lưu trạng thái phiên làm việc) để có thể scale up nhiều instance đằng sau Gateway.

---

## 2. Nguyên tắc Sở hữu Dữ liệu (Data Ownership) & Lưu ý Quan trọng

### 2.1 Cô lập Cơ sở Dữ liệu (Database per Service)
- **Quy tắc**: Mỗi microservice sở hữu cơ sở dữ liệu riêng. Tuyệt đối **KHÔNG** truy cập chéo database (kể cả quyền Read-Only).
- **Lưu ý thực tế**:
    - Không dùng chung DB Server nếu có nguy cơ cạn kiệt connection pool. Nếu dùng chung 1 RDBMS Cluster thì bắt buộc tách biệt Schema/Database Name khác nhau.
    - Mỗi service quản lý script Migration riêng (sử dụng Flyway hoặc Liquibase), không chạy chung script khởi tạo.

### 2.2 Liên kết Mềm (Soft Reference) & Ràng buộc Dữ liệu
- **Quy tắc**: `registration-service` lưu `studentId` và `courseId` dưới dạng primitive type (ví dụ `Long` / `BigInt`), **KHÔNG** tạo Foreign Key vật lý sang DB khác.
- **Lưu ý xử lý mâu thuẫn dữ liệu (Data Integrity)**:
    - Khi xoá/sửa Môn học ở `course-service`: Không thể dựa vào CASCADE DELETE của database. `course-service` phải kiểm tra hoặc phát Event thông báo sang `registration-service`.
    - Khi hiển thị thông tin chi tiết Đăng ký (bao gồm Tên Sinh viên, Tên Môn học): `registration-service` chỉ trả về IDs hoặc gọi API tổng hợp (Aggregator Pattern / Backend For Frontend - BFF), tránh gọi N+1 REST API queries.

### 2.3 Quản lý Giao dịch Phân tán (Distributed Transaction)
- **Bài toán**: Xử lý đăng ký môn học đòi hỏi vừa tạo đơn ở `registration_db`, vừa giảm số chỗ ở `course_db`.
- **Lưu ý triển khai**:
    - **KHÔNG dùng Two-Phase Commit (2PC)** vì gây nghẽn hiệu năng nghiêm trọng.
    - **Áp dụng Saga Pattern**:
        - *Orchestration Saga* hoặc *Choreography Saga* bằng Event Broker (Kafka / RabbitMQ).
        - Nếu `course-service` hết chỗ (trừ chỗ thất bại), phải kích hoạt **Compensating Transaction** (Giao dịch bù) để chuyển trạng thái bản ghi đăng ký thành `FAILED` hoặc rollback bản ghi đăng ký.

---

## 3. Cấu hình Định tuyến Gateway (Routing Rules) & Lưu ý Traffic

### 3.1 Bảng Định tuyến Chuẩn

| Route Pattern | Target Service | Phương thức / Phân quyền | Ghi chú & Lưu ý |
| :--- | :--- | :--- | :--- |
| `/api/auth/**` | `auth-service:8081` | `/login`, `/register`: Public<br>API khác: Yêu cầu JWT | Bao gồm refresh token, logout. |
| `/api/courses/**` | `course-service:8082` | `GET`: Public (hoặc Student)<br>`POST/PUT/DELETE`: `ADMIN` | Quản lý danh mục khoá học. |
| `/api/registrations/**` | `registration-service:8083` | Yêu cầu JWT hợp lệ<br>(Role: `STUDENT` hoặc `ADMIN`) | Học sinh đăng ký / xem lịch sử. |
| `/api/public/courses` | `course-service:8082` | Xác thực bằng `X-API-KEY` | Cung cấp dữ liệu cho đối tác ngoài. |

### 3.2 Lưu ý về Xử lý CORS tại Gateway
- **Cấu hình tập trung**: Toàn bộ cấu hình CORS (`Access-Control-Allow-Origin`, `Methods`, `Headers`) phải được xử lý duy nhất tại `api-gateway`.
- **Tránh trùng lặp Header**: Các microservice phía sau (`auth-service`, `course-service`,...) **KHÔNG** cấu hình CORS riêng biệt để tránh lỗi trùng lặp header `Access-Control-Allow-Origin` khiến Browser chặn request.

### 3.3 Rate Limiting & Throttling
- **Lưu ý chống nghẽn**: Thời điểm mở cổng đăng ký tín chỉ có lượng truy cập cực lớn.
- Bắt buộc cấu hình **Rate Limiter** tại `api-gateway` (sử dụng Redis Rate Limiter / Token Bucket Algorithm) để trả về `HTTP 429 Too Many Requests` khi client vượt quá ngưỡng cho phép.

---

## 4. Quy tắc Bảo mật & Giao tiếp API Nội bộ (Internal API)

### 4.1 Phân vùng API Nội bộ (`/internal/**`)
- **Định nghĩa**: Các API dùng để giao tiếp trực tiếp giữa các service (Service-to-Service), ví dụ: `POST /internal/courses/{id}/reserve-seat`.
- **Lưu ý bảo mật tuyệt đối**:
    1. `api-gateway` **KHÔNG ĐƯỢC** khai báo bất kỳ route nào forward `/internal/**`. Bất kỳ request nào từ ngoài internet gọi vào `/internal/**` phải bị Gateway từ chối ngay lập tức (`HTTP 403 Forbidden` hoặc `404 Not Found`).
    2. Cấu hình Network Security Group / Firewall chỉ cho phép IP nội bộ giữa các container/instance giao tiếp với cổng của các service.

### 4.2 Bảo mật Zero Trust & Xác thực JWT
- **Nguyên tắc**: "Never Trust, Always Verify". Microservice nội bộ không được tin tưởng mù quáng rằng request đã an toàn chỉ vì nó đi qua Gateway.
- **Lưu ý triển khai JWT**:
    - Dùng **Asymmetric Encryption (RSA - RS256)**: `auth-service` giữ Private Key để ký JWT; các microservice khác chỉ cần Public Key để tự verify chữ ký offline mà không cần call ngược lại `auth-service`.
    - Kiểm tra xem token đã bị cho vào **Blacklist / Revoked** chưa (sử dụng Redis chia sẻ chung giữa auth và gateway nếu cần thu hồi khẩn cấp).

### 4.3 Quản lý Xử lý Lỗi & Resiliency (Tự phục hồi)
- **Timeout**: Mọi lệnh gọi HTTP nội bộ giữa `registration-service` và `course-service` bắt buộc phải set Connect Timeout (ví dụ 2s) và Read Timeout (ví dụ 3s).
- **Circuit Breaker & Fallback**: Sử dụng **Resilience4j**. Khi `course-service` quá tải hoặc sập, `registration-service` kích hoạt Circuit Breaker chuyển sang trạng thái OPEN, trả về phản hồi fallback ngay lập tức ("Hệ thống quá tải, vui lòng thử lại sau") thay vì làm cạn kiệt thread pool.

---

## 5. Lưu ý Triển khai, Giám sát & Vận hành (DevOps & Observability)

### 5.1 Correlation ID (Distributed Tracing)
- **Bài toán**: Một request từ Client đi qua Gateway -> Registration Service -> Course Service. Khi xảy ra lỗi, rất khó truy vết log giữa các service.
- **Giải pháp bắt buộc**:
    - `api-gateway` tự động sinh một chuỗi UUID duy nhất làm `X-Correlation-ID` (hoặc `X-Request-ID`) nếu Client chưa gửi.
    - Gateway chuyển giao header `X-Correlation-ID` này qua tất cả các cuộc gọi HTTP/Event nội bộ tiếp theo.
    - Tất cả các service phải cấu hình Logger in kèm `Correlation ID` này vào mỗi dòng log.

### 5.2 Centralized Logging & Health Check
- Mọi microservice bắt buộc phải expose endpoint `/actuator/health` (Spring Boot Actuator) để Gateway / Load Balancer kiểm tra trạng thái sống chết (Liveness / Readiness Probes).
- Thu gom log tập trung về hệ thống như ELK Stack (Elasticsearch - Logstash - Kibana) hoặc Grafana Loki.

---

## 6. Tổng kết Checklist trước khi Go-Live

- [ ] Tất cả các DB đã được cô lập hoàn toàn, không có kết nối cross-DB.
- [ ] Bật kiểm tra JWT độc lập tại từng microservice (Zero Trust).
- [ ] Xác nhận đường dẫn `/internal/**` đã bị chặn 100% tại `api-gateway`.
- [ ] Đã cài đặt Timeout và Resilience4j Circuit Breaker cho giao tiếp REST giữa các service.
- [ ] Đã truyền `X-Correlation-ID` qua tất cả request header nội bộ.
- [ ] Cấu hình CORS chỉ nằm ở `api-gateway`.
- [ ] Đã bật Rate Limiter chống DDOS/nghẽn khi đăng ký tín chỉ.