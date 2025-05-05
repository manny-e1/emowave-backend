export function registrationOTPEmailTemplate({
	code,
	name,
	email,
}: {
	code: number;
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

    <title>Registration OTP</title>

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
                      <p style="text-align:start;">Hi ${name},</p>
                      <p style="text-align:start; font-size=20px; font-weight:600;">
                        Enter the following code to complete your login.
                      </p>
                      <p style="text-align:center; font-size=25px; font-weight:600; padding: 10px 20px; background-color:#f0f0f0; border-radius: 5px;">
                        ${code}
                      </p>
                      <p style="text-align:start;">
                        Note: This code will expire in 15 minutes upon this email is sent.
                      </p>
                      <div class="row text-center d-inline float-start"></div>
                      <p style="text-align:start;">&nbsp;</p>
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
