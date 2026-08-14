function createInterviewEvent(data){

  if(!data.interview_date){
    return;
  }

  const calendar =
      CalendarApp.getDefaultCalendar();

  const start =
      new Date(data.interview_date);

  const end =
      new Date(start.getTime()+60*60*1000);

  calendar.createEvent(

      data.company+" Interview",

      start,

      end,

      {

        description:data.summary

      }

  );

}
