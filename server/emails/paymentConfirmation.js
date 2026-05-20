const FRONTEND_URL = process.env.FRONTEND_URL;

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(date) {
  if (!date) return "your scheduled delivery date";

  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function paymentConfirmation(project) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Payment Confirmation</title>
    </head>

    <body
      style="
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
        font-family: Arial, Helvetica, sans-serif;
        color: #222;
      "
    >
      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="padding: 30px 15px;"
      >
        <tr>
          <td align="center">

            <!-- MAIN CONTAINER -->
            <table
              width="650"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                background: #ffffff;
                border-radius: 10px;
                padding: 40px;
                border: 1px solid #dddddd;
              "
            >

              <!-- HEADER -->
<tr>
  <td align="center" style="padding-bottom: 30px;">

    <img
      src="${FRONTEND_URL}/images/mylogo5.png"
      alt="HeartPrayerMusic"
      width="180"
      style="
        display: block;
        margin: 0 auto;
        border: 0;
      "
    />

  </td>
</tr>

              <!-- BODY -->
              <tr>
                <td>

                  <p style="line-height: 1.7;">
                    Thank you for trusting
                    <strong>HeartPrayerMusic</strong>
                    to transform your heart’s prayer into a song. We’re honored to be part of something so personal and meaningful.
                  </p>

                  <p style="line-height: 1.7;">
                    Our gifted artists are already prayerfully and thoughtfully
                    working on your custom song, giving careful attention to every detail so it reflects your heart and intention.
                  </p>

                  <p style="line-height: 1.7;">
                    Your custom song will be delivered on or before:
                  </p>

                  <p
                    style="
                      font-size: 18px;
                      font-weight: bold;
                      color: #1d4ed8;
                    "
                  >
                    ${formatDate(project.targetdate)}
                  </p>

                  <p style="line-height: 1.7;">
                    You may track the status of your custom song by referencing Song Code #
                    <strong>${escapeHtml(project.songcode)}</strong>
                  </p>

                  <!-- DIVIDER -->
                  <hr
                    style="
                      border: none;
                      border-top: 1px solid #dddddd;
                      margin: 30px 0;
                    "
                  />

                  <!-- SONG DETAILS -->
                  <h2
                    style="
                      margin-bottom: 20px;
                      color: #556B2F;
                    "
                  >
                    Custom Song Specification
                  </h2>

                  <table
                    width="100%"
                    cellpadding="8"
                    cellspacing="0"
                    border="0"
                    style="
                      border-collapse: collapse;
                      font-size: 14px;
                    "
                  >

                    <tr>
                      <td
                        width="35%"
                        style="
                          font-weight: bold;
                          border: 1px solid #dddddd;
                          background: #fafafa;
                        "
                      >
                        Recipient
                      </td>

                      <td
                        style="
                          border: 1px solid #dddddd;
                        "
                      >
                        ${escapeHtml(project.recipient)}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          font-weight: bold;
                          border: 1px solid #dddddd;
                          background: #fafafa;
                        "
                      >
                        Relationship
                      </td>

                      <td style="border: 1px solid #dddddd;">
                        ${escapeHtml(project.relation)}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          font-weight: bold;
                          border: 1px solid #dddddd;
                          background: #fafafa;
                        "
                      >
                        Age Group
                      </td>

                      <td style="border: 1px solid #dddddd;">
                        ${escapeHtml(project.agegroup)}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          font-weight: bold;
                          border: 1px solid #dddddd;
                          background: #fafafa;
                        "
                      >
                        Special Qualities
                      </td>

                      <td style="border: 1px solid #dddddd;">
                        ${escapeHtml(project.qualities)}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          font-weight: bold;
                          border: 1px solid #dddddd;
                          background: #fafafa;
                        "
                      >
                        Memorable Moments
                      </td>

                      <td style="border: 1px solid #dddddd;">
                        ${escapeHtml(project.moment)}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          font-weight: bold;
                          border: 1px solid #dddddd;
                          background: #fafafa;
                        "
                      >
                        Message
                      </td>

                      <td style="border: 1px solid #dddddd;">
                        ${escapeHtml(project.specialmsg)}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          font-weight: bold;
                          border: 1px solid #dddddd;
                          background: #fafafa;
                        "
                      >
                        Genre
                      </td>

                      <td style="border: 1px solid #dddddd;">
                        ${escapeHtml(project.genre)}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          font-weight: bold;
                          border: 1px solid #dddddd;
                          background: #fafafa;
                        "
                      >
                        Preferred Voice
                      </td>

                      <td style="border: 1px solid #dddddd;">
                        ${escapeHtml(project.voice)}
                      </td>
                    </tr>

                  </table>

                  <p
                    style="
                      margin-top: 35px;
                      line-height: 1.7;
                    "
                  >
                    Thank you again for allowing us to serve you through music
                    and prayer.
                  </p>

                  <p style="line-height: 1.7;">
                    Warm blessings,
                  </p>

                  <p>
                    <strong>HeartPrayerMusic Creatives Team</strong>
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

module.exports = paymentConfirmation;
