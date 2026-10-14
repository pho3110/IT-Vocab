// Chọn lọc theo 32 lesson của Workbook of English for Information Technology (2016).
// Nghĩa tiếng Việt và định nghĩa ngắn được biên soạn cho ứng dụng; không phải đáp án chính thức.
const sections = [
  ['Working in IT', 'Công việc trong ngành IT', 'briefcase', [
    ['IT jobs and duties', 'Công việc và nhiệm vụ', `developer|lập trình viên|A person who creates software.
project manager|người quản lý dự án|A person who plans and manages a project.
database administrator|quản trị viên cơ sở dữ liệu|A person who manages and maintains databases.
install|cài đặt|To set up software or equipment for use.
maintain|bảo trì|To keep a system in good working condition.`],
    ['IT organizations', 'Tổ chức và doanh nghiệp IT', `provider|nhà cung cấp dịch vụ|A company or person that provides a service.
supplier|nhà cung cấp sản phẩm|A company or person that supplies goods.
manufacturer|nhà sản xuất|A company that makes products.
client|khách hàng|A person or organisation that uses a service.
launch|ra mắt|To make a new product available for the first time.`],
    ['IT workplace rules', 'Quy tắc nơi làm việc', `security|bảo mật|Measures used to protect systems and information.
password|mật khẩu|A secret sequence used to access an account.
alphanumeric|gồm chữ và số|Containing both letters and numbers.
colleague|đồng nghiệp|A person you work with.
download|tải xuống|To transfer a file from a remote system to your device.`],
    ['Meetings', 'Cuộc họp', `chairperson|người chủ trì|The person who leads a meeting.
agenda|chương trình cuộc họp|A list of topics to discuss at a meeting.
minutes|biên bản cuộc họp|A written record of a meeting.
teleconference|hội nghị qua điện thoại|A meeting between people using telephone connections.
videoconference|hội nghị truyền hình|A meeting using live video and audio.`],
  ]],
  ['IT systems', 'Hệ thống máy tính', 'monitor', [
    ['GUI operations', 'Thao tác giao diện', `resize|thay đổi kích thước|To change the size of a window or image.
scroll bar|thanh cuộn|A control used to move through content.
icon|biểu tượng|A small graphic representing an app, file or action.
folder|thư mục|A container used to organise files.
drag|kéo|To move an item while holding a pointer button.`],
    ['Multimedia hardware', 'Phần cứng đa phương tiện', `microphone|micro|A device that captures sound.
projector|máy chiếu|A device that projects images onto a surface.
speaker|loa|A device that produces sound.
webcam|camera máy tính|A camera used to capture video on a computer.
unplug|rút phích cắm|To disconnect a cable from a socket or device.`],
    ['Operating systems', 'Hệ điều hành', `restart|khởi động lại|To stop and start a system again.
partition|phân vùng|To divide a storage drive into separate sections.
boot drive|ổ đĩa khởi động|A drive containing the files needed to start a system.
user account|tài khoản người dùng|An identity with settings and access permissions.
open source|mã nguồn mở|Describing software whose source code is available under an open-source licence.`],
    ['System specifications', 'Thông số hệ thống', `external|bên ngoài|Located outside the main device or system.
headphones|tai nghe|A device worn over or in the ears to hear audio.
solid state drive|ổ cứng thể rắn|A storage device that uses flash memory.
CPU|bộ xử lý trung tâm|The processor that executes instructions.
RAM|bộ nhớ truy cập ngẫu nhiên|Working memory used by running programs.`],
  ]],
  ['Data communications', 'Truyền thông dữ liệu', 'network', [
    ['Email', 'Thư điện tử', `subject line|dòng tiêu đề|The part of an email that states its topic.
recipient|người nhận|A person who receives a message.
signature|chữ ký|Text identifying the sender at the end of an email.
attachment|tệp đính kèm|A file sent with an email.
spell checker|công cụ kiểm tra chính tả|A tool that finds possible spelling mistakes.`],
    ['Internet browsing', 'Duyệt Internet', `browser|trình duyệt|An application used to view websites.
bookmark|dấu trang|A saved link to a web page.
link|liên kết|A reference that opens another page or resource.
refresh|tải lại|To reload content to show its latest version.
access|truy cập|To reach or use a system or information.`],
    ['Mobile computing', 'Điện toán di động', `feature|tính năng|A capability or characteristic of a product.
GPS|hệ thống định vị toàn cầu|A satellite-based system for determining location.
battery life|thời lượng pin|The time a device can operate on its battery.
customise|tùy chỉnh|To change something to suit your needs.
OCR|nhận dạng ký tự quang học|Technology that recognises text in scanned documents or images.`],
    ['Networks', 'Mạng máy tính', `wired|có dây|Connected using physical cables.
wireless|không dây|Connected without physical cables.
LAN|mạng cục bộ|A network covering a limited local area.
VPN|mạng riêng ảo|A technology that creates a protected connection over another network.
encrypt|mã hóa|To transform data so it requires a key to read.`],
  ]],
  ['Administration', 'Quản trị hệ thống', 'database', [
    ['Databases', 'Cơ sở dữ liệu', `table|bảng dữ liệu|A collection of data arranged in rows and columns.
field|trường dữ liệu|A named data item in a record.
primary key|khóa chính|A field or set of fields that uniquely identifies a record.
query the database|truy vấn cơ sở dữ liệu|To request information from a database.
retrieve a record|truy xuất bản ghi|To get a stored record from a database.`],
    ['Peripherals', 'Thiết bị ngoại vi', `NAS|thiết bị lưu trữ gắn mạng|Storage that can be accessed through a network.
stylus|bút cảm ứng|A pen-shaped tool used with a touch surface.
touch screen|màn hình cảm ứng|A display that detects touch input.
headset|tai nghe có micro|Headphones combined with a microphone.
input device|thiết bị nhập|Hardware used to send data or commands to a computer.`],
    ['Spreadsheets and formulae', 'Bảng tính và công thức', `column|cột|A vertical set of cells in a spreadsheet.
row|hàng|A horizontal set of cells in a spreadsheet.
worksheet|trang tính|A sheet containing cells in a spreadsheet file.
multiply|nhân|To calculate the product of numbers.
sum|tổng|The result of adding numbers together.`],
    ['Systems administration', 'Quản trị hệ thống', `deploy|triển khai|To put software into an environment where it can be used.
crash|sự cố dừng chương trình|An unexpected failure that stops a program.
read-only access|quyền chỉ đọc|Permission to view data without changing it.
lock someone out|chặn quyền truy cập|To prevent someone from accessing a system.
up and running again|hoạt động trở lại|Working again after an interruption.`],
  ]],
  ['Choice', 'Lựa chọn giải pháp IT', 'sliders', [
    ['IT costs', 'Chi phí IT', `accessory|phụ kiện|An extra item used with a main product.
charger|bộ sạc|A device that supplies power to recharge a battery.
extended warranty|bảo hành mở rộng|Warranty coverage extended beyond the standard period.
service|dịch vụ|Work or assistance provided to a customer.
analyse|phân tích|To examine something carefully to understand it.`],
    ['Making recommendations', 'Đưa ra đề xuất', `capability|khả năng|Something a system or product is able to do.
compatibility|khả năng tương thích|The ability of systems or products to work together.
user guide|hướng dẫn sử dụng|Instructions explaining how to use a product.
forum|diễn đàn|An online space for discussion.
conclusion|kết luận|The final judgment or summary of a discussion.`],
    ['Product research', 'Nghiên cứu sản phẩm', `traditional pricing|định giá truyền thống|A conventional pricing approach rather than tier-based pricing.
tiered pricing|định giá theo bậc|Different prices for different levels of service or usage.
trial period|thời gian dùng thử|A limited period for trying a product or service.
try out|dùng thử|To use something to see how well it works.
come out|được phát hành|To become available to the public.`],
    ['Web hosting', 'Lưu trữ website', `shared hosting|hosting dùng chung|Hosting where multiple customers share server resources.
dedicated hosting|hosting máy chủ riêng|Hosting using a server dedicated to one customer.
uptime|thời gian hoạt động|The amount of time a service is operational.
monthly bandwidth|dung lượng truyền tải hàng tháng|The data-transfer allowance for a month in a hosting plan.
IP address|địa chỉ IP|An address used to identify a network interface.`],
  ]],
  ['Interactions', 'Tương tác và dịch vụ số', 'messages', [
    ['E-commerce', 'Thương mại điện tử', `integrate|tích hợp|To combine parts so they work together.
component|thành phần|One part of a larger system.
cookie|cookie trình duyệt|A small piece of data stored by a website in a browser.
order|đơn hàng|A request to buy goods or services.
DRM|quản lý quyền kỹ thuật số|Technology used to control access to digital content.`],
    ['Enterprise social media', 'Mạng xã hội doanh nghiệp', `file sharing service|dịch vụ chia sẻ tệp|A service for making files available to other people.
privacy|quyền riêng tư|Control over access to personal information.
trend|xu hướng|A general direction of change over time.
document management system|hệ thống quản lý tài liệu|Software for organising and managing documents.
voice recognition|nhận dạng giọng nói|Technology that identifies or interprets spoken input.`],
    ['Training users', 'Đào tạo người dùng', `instant messaging|nhắn tin tức thời|Exchanging text messages in real time.
policy|chính sách|A set of rules or principles guiding actions.
procedure|quy trình|A defined sequence of steps for a task.
archiving|lưu trữ lâu dài|Moving or preserving information for future reference.
tagging|gắn thẻ|Adding labels to organise or find content.`],
    ['Video conferencing', 'Hội nghị truyền hình', `face-to-face|trực tiếp|With people physically present together.
high-definition|độ nét cao|Describing video or images with high resolution.
remote|từ xa|Located away from the main location.
data compression|nén dữ liệu|Reducing the size of data for storage or transmission.
MCU|bộ điều khiển hội nghị đa điểm|A device or system that connects multiple conferencing endpoints.`],
  ]],
  ['Development', 'Phát triển phần mềm', 'code', [
    ['Project management', 'Quản lý dự án', `Gantt chart|biểu đồ Gantt|A chart showing tasks and their planned timing.
alpha testing|kiểm thử alpha|Early testing usually carried out in a controlled internal environment.
beta testing|kiểm thử beta|Testing by selected users before a final release.
feedback|phản hồi|Comments used to evaluate or improve something.
release candidate|bản ứng viên phát hành|A version that may become the final release if no blocking problems are found.`],
    ['Requirements analysis', 'Phân tích yêu cầu', `approve|phê duyệt|To formally accept a proposal or result.
programmer|lập trình viên|A person who writes computer programs.
debug|gỡ lỗi|To find and fix problems in software.
interview|phỏng vấn|To ask questions to gather information.
specification|đặc tả|A detailed description of required behaviour or features.`],
    ['Software development', 'Phát triển phần mềm', `line of code|dòng mã|One line of instructions in a program.
instruction|chỉ thị|A command that tells a computer what to do.
variable|biến|A named reference to a value that may change.
value|giá trị|The data represented by an expression or variable.
calculate|tính toán|To work out a result using numbers or rules.`],
    ['Website design and architecture', 'Thiết kế và kiến trúc website', `home page|trang chủ|The main entry page of a website.
FAQs|câu hỏi thường gặp|Frequently asked questions and their answers.
purchase|mua hàng|To buy a product or service.
private|riêng tư|Available only to authorised people.
dynamic|động|Changing in response to data or user interaction.`],
  ]],
  ['Solutions', 'Giải quyết vấn đề IT', 'tool', [
    ['Diagnosis', 'Chẩn đoán sự cố', `call centre|trung tâm cuộc gọi|An organisation that handles customer calls.
issue tracking system|hệ thống theo dõi sự cố|Software used to record and track reported problems.
ticket|phiếu hỗ trợ|A record of a support request or issue.
escalate|chuyển lên cấp hỗ trợ cao hơn|To pass an issue to a higher support level.
troubleshooting guide|hướng dẫn xử lý sự cố|Instructions for identifying and resolving problems.`],
    ['Investigations', 'Điều tra nguyên nhân', `connection error|lỗi kết nối|A problem that prevents a connection from working.
failure|sự hỏng hóc|A situation where a system cannot perform its function.
fault|lỗi kỹ thuật|A defect that causes incorrect operation.
hang|treo máy hoặc chương trình|To stop responding while still appearing to run.
error code|mã lỗi|A code identifying a specific error condition.`],
    ['Solutions', 'Giải pháp và an toàn', `bloatware|phần mềm dư thừa|Unwanted software that uses storage or system resources.
electric shock|điện giật|An injury or sensation caused by electricity passing through the body.
short circuit|đoản mạch|An unintended electrical connection with low resistance.
RSI|chấn thương do thao tác lặp lại|Repetitive strain injury caused by repeated movements.
cool down|làm nguội|To reduce temperature or allow something to become cooler.`],
    ['Your future in IT', 'Tương lai nghề nghiệp IT', `CV|sơ yếu lý lịch nghề nghiệp|A document summarising education, skills and work experience.
education|học vấn|Learning and qualifications gained through study.
responsibility|trách nhiệm|A duty or task that someone is expected to handle.
organisational skill|kỹ năng tổ chức|The ability to plan and arrange work effectively.
personal information|thông tin cá nhân|Details relating to an individual.`],
  ]],
];

export const units = sections.map(([title, subtitle, icon, lessons], i) => ({
  id: i + 1, title, subtitle, icon,
  lessons: lessons.map(([title, subtitle, raw], j) => ({
    id: `${i + 1}${'ABCD'[j]}`, title, subtitle,
    words: raw.split('\n').map((line, k) => {
      const [term, meaning, definition] = line.split('|');
      return { id: `${i + 1}${'ABCD'[j]}-${k + 1}`, unitId: i + 1, lessonId: `${i + 1}${'ABCD'[j]}`, term, meaning, definition };
    }),
  })),
}));
export const words = units.flatMap(unit => unit.lessons.flatMap(lesson => lesson.words));
export const wordById = Object.fromEntries(words.map(word => [word.id, word]));
