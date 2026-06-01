"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostStatus = exports.SocialPlatform = void 0;
var SocialPlatform;
(function (SocialPlatform) {
    SocialPlatform["TWITTER"] = "TWITTER";
    SocialPlatform["LINKEDIN"] = "LINKEDIN";
    SocialPlatform["FACEBOOK"] = "FACEBOOK";
    SocialPlatform["INSTAGRAM"] = "INSTAGRAM";
    SocialPlatform["SLACK"] = "SLACK";
    SocialPlatform["TEAMS"] = "TEAMS";
})(SocialPlatform || (exports.SocialPlatform = SocialPlatform = {}));
var PostStatus;
(function (PostStatus) {
    PostStatus["DRAFT"] = "DRAFT";
    PostStatus["SCHEDULED"] = "SCHEDULED";
    PostStatus["PUBLISHING"] = "PUBLISHING";
    PostStatus["PUBLISHED"] = "PUBLISHED";
    PostStatus["FAILED"] = "FAILED";
    PostStatus["CANCELLED"] = "CANCELLED";
})(PostStatus || (exports.PostStatus = PostStatus = {}));
//# sourceMappingURL=social.js.map