package com.personal.chat_app.Repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.personal.chat_app.Documents.Invites;
import com.personal.chat_app.utils.Constants.Status;

@Repository
public interface IInvitesRepository extends MongoRepository<Invites, String> {

    @Query("{ 'status':?0, 'toUserId':?1 }")
    List<Invites> getInvitesByStatusAndToUserId(Status status, String toUserId);

}
