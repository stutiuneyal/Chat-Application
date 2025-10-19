package com.personal.chat_app.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.personal.chat_app.Documents.Rooms;

@Repository
public interface IRoomRepository extends MongoRepository<Rooms, String> {

    List<Rooms> findByIsPrivateFalseAndNameRegex(String text);

    List<Rooms> findByNameRegex(String text);

}
