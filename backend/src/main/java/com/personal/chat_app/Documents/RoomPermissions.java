package com.personal.chat_app.Documents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomPermissions {

    private boolean allowReplies;
    private boolean allowDeleteOwn;
    private boolean allowUserInvite;
    private boolean allowSelfJoinPublic;
}
