package com.example.student_management_api.studentclass;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentClassRepository extends JpaRepository<StudentClass, Long> {
    Optional<StudentClass> findByClassCode(String classCode);
    boolean existsByClassCode(String classCode);
}