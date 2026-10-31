package com.example.student_management_api.department;

import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "departments")
public class Department {
    public enum Status { ACTIVE, INACTIVE }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "department_code", nullable = false, unique = true, length = 20)
    private String departmentCode;
    @Column(nullable = false, length = 150)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    public Long getId(){return id;}
    public String getDepartmentCode(){return departmentCode;}
    public void setDepartmentCode(String v){departmentCode=v;}
    public String getName(){return name;}
    public void setName(String v){name=v;}
    public String getDescription(){return description;}
    public void setDescription(String v){description=v;}
    public Status getStatus(){return status;}
    public void setStatus(Status v){status=v;}
}