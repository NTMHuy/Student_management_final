package com.example.student_management_api.student;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {

    @EntityGraph(attributePaths = {"studentClass", "studentClass.major"})
    List<Student> findAllByOrderByStudentCode();

    @EntityGraph(attributePaths = {"studentClass", "studentClass.major"})
    Optional<Student> findWithStudentClassById(Long id);

    boolean existsByEmailIgnoreCase(String email);
}