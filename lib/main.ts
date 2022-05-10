import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AuroraServerlessTemporalDatastore, TemporalCluster, TemporalVersion } from 'temporalio-cluster-cdk';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { PrivateDnsNamespace } from 'aws-cdk-lib/aws-servicediscovery';
import { AuroraMysqlEngineVersion, DatabaseClusterEngine } from 'aws-cdk-lib/aws-rds';
import { Cluster } from 'aws-cdk-lib/aws-ecs';

const app = new App();

const stack = new Stack(app, 'MyTemporalClusterStack', {
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },
});

const vpc = new Vpc(stack, 'Vpc', {
    maxAzs: 2,
    natGateways: 1,
});

const cloudMapNamespace = new PrivateDnsNamespace(stack, 'CloudMapNamespace', {
    name: 'privatesvc',
    vpc: vpc,
});

const datastore = new AuroraServerlessTemporalDatastore(stack, 'Datastore', {
    engine: DatabaseClusterEngine.auroraMysql({ version: AuroraMysqlEngineVersion.VER_2_10_1 }),
    vpc,
    removalPolicy: RemovalPolicy.DESTROY,
});

const ecsCluster = new Cluster(stack, 'EcsCluster', {
    vpc: vpc,
    enableFargateCapacityProviders: true,
    containerInsights: true,
});

new TemporalCluster(stack, 'TemporalCluster', {
    vpc,
    datastore,
    ecsCluster,
    temporalVersion: TemporalVersion.V1_15_2,
    cloudMapRegistration: {
        namespace: cloudMapNamespace,
        serviceName: 'temporal',
    },
    removalPolicy: RemovalPolicy.DESTROY,
});

app.synth();
