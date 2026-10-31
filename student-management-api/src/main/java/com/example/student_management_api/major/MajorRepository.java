package com.example.student_management_api.major;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MajorRepository extends JpaRepository<Major, Long> {
    List<Major> findAllByDepartmentId(Long departmentId);
    Optional<Major> findByMajorCode(String majorCode);
    boolean existsByMajorCode(String majorCode);
}