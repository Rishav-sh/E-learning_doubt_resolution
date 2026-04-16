package com.example.demo.controller;

import com.example.demo.model.DoubtThread;
import com.example.demo.model.DoubtStatus;
import com.example.demo.repository.DoubtThreadRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.dto.request.DoubtRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/doubts")
public class DoubtController {

    @Autowired
    DoubtThreadRepository doubtRepository;

    @Autowired
    UserRepository userRepository;

    // 1. Create Doubt
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createDoubt(@RequestBody DoubtRequest request) {
        DoubtThread doubt = new DoubtThread(request.getQuestion(), request.getStudentId());
        doubtRepository.save(doubt);
        return ResponseEntity.ok(doubt);
    }

    // 2. Get All Doubts (Open ones usually needed for the feed)
    @GetMapping
    public ResponseEntity<List<DoubtThread>> getAllDoubts() {
        // Here we just fetch OPEN doubts to keep the feed relevant
        List<DoubtThread> doubts = doubtRepository.findByStatusOrderByCreatedAtDesc(DoubtStatus.OPEN);
        return ResponseEntity.ok(doubts);
    }

    // 3. Update Status (Pickup by Expert)
    @PutMapping("/{id}/pickup/{expertId}")
    @PreAuthorize("hasRole('EXPERT')")
    public ResponseEntity<?> pickupDoubt(@PathVariable Long id, @PathVariable Long expertId) {
        Optional<DoubtThread> doubtData = doubtRepository.findById(id);

        if (doubtData.isPresent()) {
            DoubtThread doubt = doubtData.get();
            if (doubt.getStatus() == DoubtStatus.OPEN) {
                doubt.setStatus(DoubtStatus.IN_PROGRESS);
                doubt.setExpertId(expertId);
                doubtRepository.save(doubt);
                return ResponseEntity.ok(doubt);
            } else {
                return ResponseEntity.badRequest().body("Doubt is not OPEN (it might be already picked up).");
            }
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Optional: Mark as Resolved
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveDoubt(@PathVariable Long id) {
        Optional<DoubtThread> doubtData = doubtRepository.findById(id);

        if (doubtData.isPresent()) {
            DoubtThread doubt = doubtData.get();
            doubt.setStatus(DoubtStatus.RESOLVED);
            doubtRepository.save(doubt);
            return ResponseEntity.ok(doubt);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
