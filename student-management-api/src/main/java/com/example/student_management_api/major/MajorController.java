package com.example.student_management_api.major;

import com.example.student_management_api.auth.ActorResolver;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/majors")
public class MajorController {
    private final MajorService service;
    private final ActorResolver actors;
    public MajorController(MajorService service, ActorResolver actors) { this.service=service; this.actors=actors; }
    @GetMapping public List<MajorResponse> list(@RequestParam(required=false) String search,
        @RequestParam(required=false) Long departmentId) { return service.list(search, departmentId); }
    @GetMapping("/{id}") public MajorResponse get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public MajorResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody MajorRequest request) {
        return service.create(actors.from(jwt), request);
    }
    @PutMapping("/{id}")
    public MajorResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody MajorRequest request) {
        return service.update(actors.from(jwt), id, request);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) { service.delete(actors.from(jwt), id); }
}