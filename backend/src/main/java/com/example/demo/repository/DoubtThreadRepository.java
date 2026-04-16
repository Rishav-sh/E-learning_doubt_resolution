package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.demo.model.DoubtThread;
import com.example.demo.model.DoubtStatus;
import java.util.List;

@Repository
public interface DoubtThreadRepository extends JpaRepository<DoubtThread, Long> {
    List<DoubtThread> findByStatusOrderByCreatedAtDesc(DoubtStatus status);
}
