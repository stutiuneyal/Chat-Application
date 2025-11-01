package com.personal.chat_app.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.personal.chat_app.Documents.JoinRequests;
import com.personal.chat_app.utils.Constants.Status;

@Repository
public interface IJoinRequestsRepository extends MongoRepository<JoinRequests, String> {

    @Query("{ 'raisedbyUserId':?0, 'roomId':?1, 'status':{: ?2} }")
    boolean findUserRoomJoinRequestNotRejected(String userId, String roomId, Status rejected);

    @Query("{ 'roomId': ?0, 'status': ?1 }")
    List<JoinRequests> listJoinRequestsByRoomIdAndStatus(String roomId, Status status);

}
