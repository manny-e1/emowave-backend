export function resetPasswordEmailTemplate({
  link,
  name,
  email,
}: {
  link: string;
  name: string;
  email: string;
}) {
  return `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, shrink-to-fit=no"
    />
    <title>Reset Password</title>

  </head>

  <body style="background-image: url('cid:frame');
  background-repeat: repeat;">
    <main style="display: flex; width: 100%; justify-content: center; margin: 2rem 0;">
      <div class="main">
        <div class="content">
          <div class="container-fluid p-0 w-100">
            <div class="container d-flex flex-column text-center">
              <div class="row vh-100">
                <div class="col-sm-8 col-md-6 col-lg-6 mx-auto d-table h-100" style="margin-bottom:20px;">
                  <div
                    class="d-table-cell align-top"
                    style="padding-left: 20px; padding-right: 20px"
                  >
                    <div class="row">&nbsp;</div>
                    <div class="row">
                      <h2 style="text-align: center;">Reset Password</h2>
                    </div>
                    <div style="text-align: center; color: gray;">
                      <p class="col-form-label-sm text-secondary">
                        <strong
                          >*** This is an automatically generated email, please
                          do not reply ***</strong
                        >
                      </p>
                    </div>
                    <div class="row">&nbsp;</div>
                    <div
                      style="-webkit-box-shadow:  0 0 1px rgba(0,0,0,.125),0 1px 3px rgba(0,0,0,.2);
                      box-shadow: 0 0 1px rgba(0,0,0,.125),0 1px 3px rgba(0,0,0,.2);
                      background-color: #fff;
                      padding:1px 10px;
                      width: auto;
                      max-width: fit-content;
                      margin: 0 auto;
                      "
                    >
                      <p class="text-start">Hi ${name},</p>
                      <p class="text-start">
                        You have recently requested to have password reset
                        for <span class="text-info" style="color:#17a2b8;">${email}</span>
                      </p>
                      <p class="text-start">
                        To reset your password please click this
                        <a href=${link}>link</a>.
                      </p>
                      <p class="text-start">
                        Note: This link will expire in 30 minutes upon this email is sent.
                      </p>
                      <p class="text-start">
                        *If this is a mistake just ignore this email - your
                        password will not be changed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      </div>
          </div>
        </main>
      </main>
    </div>
  </body>
</html>

  `;
}
