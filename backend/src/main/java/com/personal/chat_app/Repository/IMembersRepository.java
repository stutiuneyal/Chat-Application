package com.personal.chat_app.Repository;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.personal.chat_app.Documents.Members;

@Repository
public interface IMembersRepository extends MongoRepository<Members, String> {

    List<Members> findByRoomId(String roomId); // find all the members in a room

    List<Members> findByUserId(String userId); // find all rooms a user is member of

    boolean existsByRoomIdAndUserId(String roomId, String userId); // whether user is a member of the room

}
