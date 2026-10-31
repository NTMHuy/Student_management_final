package com.example.student_management_api.semester;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "semesters", uniqueConstraints = @UniqueConstraint(name = "uq_semesters_year_term", columnNames = {"academic_year","term_number"}))
public class Semester {
    public enum Status { PLANNED, OPEN, IN_PROGRESS, COMPLETED, ARCHIVED }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "academic_year", nullable = false, length = 9)
    private String academicYear;
    @Column(name = "term_number", nullable = false)
    private Short termNumber;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private Status status = Status.PLANNED;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    public Long getId(){return id;}
    public String getAcademicYear(){return academicYear;}
    public void setAcademicYear(String v){academicYear=v;}
    public Short getTermNumber(){return termNumber;}
    public void setTermNumber(Short v){termNumber=v;}
    public String getName(){return name;}
    public void setName(String v){name=v;}
    public LocalDate getStartDate(){return startDate;}
    public void setStartDate(LocalDate v){startDate=v;}
    public LocalDate getEndDate(){return endDate;}
    public void setEndDate(LocalDate v){endDate=v;}
    public Status getStatus(){return status;}
    public void setStatus(Status v){status=v;}
}