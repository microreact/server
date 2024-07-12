/* eslint-disable camelcase */

module.exports = {
  async up(db, client) {
    let index = 0;

    const updatedAt = new Date();

    const oldUsersCount = await db.collection("users").count({});

    const oldUsersCursor = db.collection("users").find({}).addCursorFlag("noCursorTimeout", true);
    for await (const doc of oldUsersCursor) {
      console.info("Updating user %s / %s. %s %s \r", index, oldUsersCount, doc._id, doc.email);

      const {
        _id,
        createdAt,
        email,
        name,
        organisation,
        photo,
        profile_id,
        profile_type,
        apiAccessToken,
      } = doc;

      // console.time(`find new user`)
      const newUser = await db.collection("new-users").findOne({ email });
      // console.timeEnd(`find new user`)

      let newUserId = null;

      if (newUser) {
        newUserId = newUser._id;

        // console.time(`update owner`)
        await db.collection("projects").update(
          { owner: _id },
          {
            $set: { owner: newUser._id },
          },
          { multi: true },
        );
        // console.timeEnd(`update owner`)

        // console.time(`find shares`)
        const sharedProjects = await db.collection("projects").find(
          { "shares.user": _id },
          { _id: 1, shares: 1 },
        ).toArray();
        // console.timeEnd(`find shares`)

        if (sharedProjects) {
          // console.time(`update shares`)
          for (const sharedProject of sharedProjects) {
            for (const share of sharedProject.shares) {
              if (share.user?.equals(_id)) {
                share.user = newUser._id;
              }
            }
            await db.collection("projects").update(
              { _id: sharedProject._id },
              {
                $set: { shares: sharedProject.shares },
              }
            );
          }
          // console.timeEnd(`update shares`)
        }
      }
      else {
        // console.time(`create new user`)
        await db.collection("new-users").insertOne(
          {
            _id,
            createdAt,
            email,
            name,
            image: photo,
            apiAccessToken,
            updatedAt,
          }
        );
        // console.timeEnd(`create new user`)
        newUserId = _id;
      }

      // console.time(`create account`)
      await db.collection("accounts").insertOne(
        {
          compoundId: null,
          userId: newUserId,
          providerType: "oauth",
          providerId: profile_type,
          providerAccountId: profile_id,
          refreshToken: null,
          accessToken: null,
          accessTokenExpires: null,
          createdAt: updatedAt,
          updatedAt,
        }
      );
      // console.timeEnd(`create account`)

      index++;
    }

    await db.collection("users").rename("_users");
    await db.collection("new-users").rename("users");
  },

  async down(db, client) {
    await db.collection("_users").rename("users");
    await db.collection("accounts").drop();
  },
};
