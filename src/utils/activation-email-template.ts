export function activationEmailTemplate({
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

    <title>User Activation</title>

  </head>

  <body style="background-image: url('cid:frame');
  background-repeat: repeat;">
    <main style="display: flex; width: 100%; justify-content: center; margin: 2rem 0;">
      <div class="main">
        <main class="content">
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
                      <h2 style="text-align: center;">User Activation</h2>
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
                    padding:1px 10px 1px 20px;
                    width: auto;
                    max-width: fit-content;
                    max-height: fit-content;
                    margin: 0 auto;
                    "
                    >
                      <p class="text-start">Hi ${name},</p>
                      <p class="text-start">
                        Please click this link <a href=${link}>Activate Account</a> to set your
                        own password and activate your new account. 
                      </p>
                      <p class="text-start">Username (Email): ${email}</p>
                      <p class="text-start">
                        Note: This link will expire in 30 minutes upon this email is sent.
                      </p>
                      <div class="row text-center d-inline float-start"></div>
                      <p class="text-start">&nbsp;</p>
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
