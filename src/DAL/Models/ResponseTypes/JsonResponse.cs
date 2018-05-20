namespace DAL.Models.ResponseTypes
{
    public class JsonResponse : IResponseType<object>
    {
        public int Id { get;set;}

        public object Value {get;set;}


    }

}