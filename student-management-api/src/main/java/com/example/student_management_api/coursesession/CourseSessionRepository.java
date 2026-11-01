package com.example.student_management_api.coursesession;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseSessionRepository extends JpaRepository<CourseSession, Long> {
    List<CourseSession> findAllByCourseSectionIdOrderBySessionDateAscStartTimeAsc(Long courseSectionId);
    List<CourseSession> findAllByOrderBySessionDateAscStartTimeAsc();
}
