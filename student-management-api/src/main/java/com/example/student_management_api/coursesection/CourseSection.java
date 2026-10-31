package com.example.student_management_api.coursesection;

import com.example.student_management_api.semester.Semester;
import com.example.student_management_api.subject.Subject;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "course_sections", uniqueConstraints = @UniqueConstraint(name = "uq_course_sections_semester_code", columnNames = {"semester_id","section_code"}))
public class CourseSection {
    public enum Status { DRAFT, OPEN, IN_PROGRESS, COMPLETED, CANCELLED }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;
    @Column(name = "section_code", nullable = false, length = 30)
    private String sectionCode;
    @Column(name = "section_name", length = 150)
    private String sectionName;
    @Column(nullable = false)
    private Integer capacity;
    @Column(name = "process_weight", nullable = false, precision = 5, scale = 2)
    private BigDecimal processWeight;
    @Column(name = "midterm_weight", nullable = false, precision = 5, scale = 2)
    private BigDecimal midtermWeight;
    @Column(name = "final_weight", nullable = false, precision = 5, scale = 2)
    private BigDecimal finalWeight;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private Status status = Status.DRAFT;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    public Long getId(){return id;}
    public Subject getSubject(){return subject;}
    public void setSubject(Subject v){subject=v;}
    public Semester getSemester(){return semester;}
    public void setSemester(Semester v){semester=v;}
    public String getSectionCode(){return sectionCode;}
    public void setSectionCode(String v){sectionCode=v;}
    public String getSectionName(){return sectionName;}
    public void setSectionName(String v){sectionName=v;}
    public Integer getCapacity(){return capacity;}
    public void setCapacity(Integer v){capacity=v;}
    public BigDecimal getProcessWeight(){return processWeight;}
    public void setProcessWeight(BigDecimal v){processWeight=v;}
    public BigDecimal getMidtermWeight(){return midtermWeight;}
    public void setMidtermWeight(BigDecimal v){midtermWeight=v;}
    public BigDecimal getFinalWeight(){return finalWeight;}
    public void setFinalWeight(BigDecimal v){finalWeight=v;}
    public Status getStatus(){return status;}
    public void setStatus(Status v){status=v;}
}