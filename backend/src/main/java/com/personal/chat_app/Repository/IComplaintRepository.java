package com.personal.chat_app.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.personal.chat_app.Documents.Complaints;

@Repository
public interface IComplaintRepository extends MongoRepository<Complaints, String> {

    List<Complaints> findByRoomId(String roomId);

    List<Complaints> findByStatus(String status);
}
