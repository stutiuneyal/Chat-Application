package com.personal.chat_app.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.personal.chat_app.Documents.Messages;

@Repository
public interface IMessageRepository extends MongoRepository<Messages, String> {

    List<Messages> findTop100ByRoomIdOrderByCreatedAtDesc(String roomId);

    Page<Messages> findByRoomIdOrderByCreatedAtDesc(String roomId, PageRequest of);

}
