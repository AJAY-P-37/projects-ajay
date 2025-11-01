import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";
import FirebaseController from "./firebase.controller";
import { AuthMiddleware } from "./firebase-auth.guard";

@Module({
  providers: [FirebaseService],
  controllers: [FirebaseController],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: "auth/signin", method: RequestMethod.POST },
        { path: "auth/firebase", method: RequestMethod.POST },
      );
    // .forRoutes("*"); // apply to all other routes
  }
}
