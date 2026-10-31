package com.example.student_management_api.coursesection;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {
    List<CourseSection> findAllBySemesterId(Long semesterId);
    Optional<CourseSection> findBySemesterIdAndSectionCode(Long semesterId, String sectionCode);
    boolean existsBySemesterIdAndSectionCode(Long semesterId, String sectionCode);
}