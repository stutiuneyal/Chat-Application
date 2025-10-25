package com.personal.chat_app.Repository;

import java.util.List;
import java.util.regex.Pattern;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.personal.chat_app.Documents.Rooms;

@Repository
public interface IRoomRepository extends MongoRepository<Rooms, String> {

    List<Rooms> findByIsPrivateFalseAndNameRegex(Pattern text);

    List<Rooms> findByNameRegex(Pattern text);

}
