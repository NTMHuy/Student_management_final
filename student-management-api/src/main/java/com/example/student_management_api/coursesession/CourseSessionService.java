package com.example.student_management_api.coursesession;

import com.example.student_management_api.auth.Actor;
import com.example.student_management_api.common.Text;
import com.example.student_management_api.coursesection.CourseSection;
import com.example.student_management_api.coursesection.CourseSectionRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CourseSessionService {
    private final CourseSessionRepository sessions;
    private final CourseSectionRepository sections;

    public CourseSessionService(CourseSessionRepository sessions, CourseSectionRepository sections) {
        this.sessions = sessions;
        this.sections = sections;
    }

    public List<CourseSessionResponse> list(Long courseSectionId) {
        List<CourseSession> rows = courseSectionId == null
            ? sessions.findAllByOrderBySessionDateAscStartTimeAsc()
            : sessions.findAllByCourseSectionIdOrderBySessionDateAscStartTimeAsc(courseSectionId);
        return rows.stream().map(CourseSessionResponse::from).toList();
    }

    public CourseSessionResponse get(Long id) {
        return CourseSessionResponse.from(find(id));
    }

    @Transactional
    public CourseSessionResponse create(Actor actor, CourseSessionRequest request) {
        actor.requireAdmin();
        CourseSession session = new CourseSession();
        apply(session, request);
        return CourseSessionResponse.from(sessions.saveAndFlush(session));
    }

    @Transactional
    public CourseSessionResponse update(Actor actor, Long id, CourseSessionRequest request) {
        actor.requireAdmin();
        CourseSession session = find(id);
        apply(session, request);
        return CourseSessionResponse.from(session);
    }

    @Transactional
    public void delete(Actor actor, Long id) {
        actor.requireAdmin();
        sessions.delete(find(id));
        sessions.flush();
    }

    private CourseSession find(Long id) {
        return sessions.findById(id)
            .orElseThrow(() -> Text.notFound("Không tìm thấy buổi học"));
    }

    private void apply(CourseSession session, CourseSessionRequest request) {
        if (!request.endTime().isAfter(request.startTime())) {
            throw Text.badRequest("Giờ kết thúc phải sau giờ bắt đầu");
        }
        CourseSection section = sections.findById(request.courseSectionId())
            .orElseThrow(() -> Text.badRequest("Lớp học phần không tồn tại"));
        if (section.getStatus() == CourseSection.Status.CANCELLED
                || section.getStatus() == CourseSection.Status.COMPLETED) {
            throw Text.conflict("Không thể xếp lịch cho lớp học phần đã kết thúc hoặc bị huỷ");
        }
        CourseSession.Status status = Text.parseEnum(
            CourseSession.Status.class, request.status(), "Trạng thái buổi học không hợp lệ");
        session.setCourseSection(section);
        session.setSessionDate(request.sessionDate());
        session.setStartTime(request.startTime());
        session.setEndTime(request.endTime());
        session.setRoom(Text.blankToNull(request.room()));
        if (status != null) session.setStatus(status);
    }
}
