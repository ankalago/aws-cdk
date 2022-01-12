import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as path from 'path';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // Dynamo DB
    const greetingsTable = new dynamodb.Table(this, "GreetingsTable", {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    })

    const saveHelloFuntcion = new lambda.Function(this, "SaveHelloFuntcion", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
      handler: "handler.saveHello",
      environment: {
        GREETING_TABLE: greetingsTable.tableName
      }
    });

    const getHelloFuntcion = new lambda.Function(this, "GetHelloFuntcion", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
      handler: "handler.getHello",
      environment: {
        GREETING_TABLE: greetingsTable.tableName
      }
    });

    // permissions to lambda to dynamo table
    greetingsTable.grantReadWriteData(saveHelloFuntcion);
    greetingsTable.grantReadWriteData(getHelloFuntcion);

    // create API GATEWAY
    const helloAPI = new apigw.RestApi(this, "helloApi");

    helloAPI.root
      .resourceForPath("hello")
      .addMethod("POST", new apigw.LambdaIntegration(saveHelloFuntcion))

    helloAPI.root
      .resourceForPath("hello")
      .addMethod("GET", new apigw.LambdaIntegration(getHelloFuntcion))
  }
}
