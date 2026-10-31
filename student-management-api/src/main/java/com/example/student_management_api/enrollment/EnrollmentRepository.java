package com.example.student_management_api.enrollment;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    long countByCourseSectionIdAndStatusIn(Long courseSectionId, List<Enrollment.Status> statuses);
    boolean existsByStudentIdAndCourseSectionId(Long studentId, Long courseSectionId);
    Optional<Enrollment> findByStudentIdAndCourseSectionId(Long studentId, Long courseSectionId);
    List<Enrollment> findAllByCourseSectionId(Long courseSectionId);
}