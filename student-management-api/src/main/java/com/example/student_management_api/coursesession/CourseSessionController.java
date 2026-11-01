package com.example.student_management_api.coursesession;

import com.example.student_management_api.auth.ActorResolver;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/course-sessions")
public class CourseSessionController {
    private final CourseSessionService service;
    private final ActorResolver actors;

    public CourseSessionController(CourseSessionService service, ActorResolver actors) {
        this.service = service;
        this.actors = actors;
    }

    @GetMapping
    public List<CourseSessionResponse> list(
        @RequestParam(required = false) Long courseSectionId) {
        return service.list(courseSectionId);
    }

    @GetMapping("/{id}")
    public CourseSessionResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseSessionResponse create(@AuthenticationPrincipal Jwt jwt,
                                        @Valid @RequestBody CourseSessionRequest request) {
        return service.create(actors.from(jwt), request);
    }

    @PutMapping("/{id}")
    public CourseSessionResponse update(@AuthenticationPrincipal Jwt jwt,
                                        @PathVariable Long id,
                                        @Valid @RequestBody CourseSessionRequest request) {
        return service.update(actors.from(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.delete(actors.from(jwt), id);
    }
}
