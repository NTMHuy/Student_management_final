package com.example.student_management_api.studentclass;

import com.example.student_management_api.auth.ActorResolver;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student-classes")
public class StudentClassController {
    private final StudentClassService service;
    private final ActorResolver actors;
    public StudentClassController(StudentClassService service, ActorResolver actors) { this.service=service; this.actors=actors; }
    @GetMapping public List<StudentClassResponse> list(@RequestParam(required=false) String search,
        @RequestParam(required=false) Long majorId, @RequestParam(required=false) Short intakeYear) {
        return service.list(search,majorId,intakeYear);
    }
    @GetMapping("/{id}") public StudentClassResponse get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public StudentClassResponse create(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody StudentClassRequest request) {
        return service.create(actors.from(jwt),request);
    }
    @PutMapping("/{id}")
    public StudentClassResponse update(@AuthenticationPrincipal Jwt jwt,@PathVariable Long id,@Valid @RequestBody StudentClassRequest request) {
        return service.update(actors.from(jwt),id,request);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt,@PathVariable Long id) { service.delete(actors.from(jwt),id); }
}